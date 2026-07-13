import fs from 'fs'
import path from 'path'
import https from 'https'

const PROJECT_ID = '8gi1g2j6'
const DATASET = 'production'
const TOKEN =
  'skSszZR2wwcQP7rvK1r4rUluLvzRzHYs9DL9tD5GxboOiDe7LhnNGeKGtHqEFQAh5I2DHEfCXXhziRN2uTtl6KJRd4gmnJjllcax4wmZ16DUpuTO9VunWyQGUIkHeKjAPVsiU36RpdPZlsMT2giQZr4hBM91Dd15VspYI61wUgfpDNTOfrni'
const PHOTOS_DIR =
  'C:\\Users\\Dennis\\Downloads\\liveroof_ontario_projects\\liveroof_ontario'

const PROJECT_SLUGS = [
  '106-glen-road',
  '11-superior',
  '1128-yonge-street',
  '141-adelaide-street-west',
  '155-redpath',
  '1966-concession-6-west',
  '240-sterling',
  '33-prince-arthur-ave',
  '51-hillholm-road',
  '80-atlantic',
  'algonquin-college---ielciie',
  'art-gallery-of-windsor',
  'bathurst-fort-york-library',
  'brampton-city-hall',
  'bridgepoint-health',
  'burnhamthorpe-library',
  'carleton-university-canal-building',
  'cathedral-hill-condos',
  'centennial-college-library',
  'centre-for-addiction-and-mental-health-buildings-b-d',
  'chapelview-affordable-housing',
  'clanmore-montessori',
  'dufferin-lions-arena',
  'dufferin-transfer-station-personnel-building',
  'earls-court-village',
  'ed-blake-park-fieldhouse',
  'eglington-west-station',
  'emsf-eglinton-maintenance-and-service-facility',
  'esri-canada',
  'fanshawe-college-automotive-technologies-building',
  'fanshawe-college-d-block',
  'farmers-mutual-re-insurance',
  'fleming-college-frost-campus',
  'garden-city-tower',
  'goldring-centre-for-high-performance-sport-varsity',
  'goldring-high-performance-athletic-center',
  'goodes-hall-queens-university',
  'hamilton-city-hall',
  'highbury-longterm-care',
  'hillen-nursery-lunchroom',
  'humber-river-regional-hospital',
  'ivy-school-of-business-live-roof',
  'joseph-brant-hospital',
  'kilworth-car-wash',
  'kinoak-arena-utility-room',
  'kipling-acres-longterm-care',
  'kipling-go-station',
  'lambton-college-sustainable-house',
  'library-district-condominiums-block-32',
  'london-city-hall',
  'milton-district-hospital-expansion',
  'mississauga-celebration-square',
  'mississauga-ems-station-106',
  'nordstrom-sherway-gardens',
  'nordstrom-yorkdale',
  'ojibway-nature-centre',
  'old-post-office-idea-exchange',
  'orillia-public-library',
  'philip-aziz-childrens-hospice',
  'regent-park-block-24',
  'rideau-centre',
  'sackville-place',
  'south-east-collector-sanitary',
  'south-east-london-pumping-station',
  'st-ignatius-of-loyola-catholic-elementary-school',
  'stoney-creek-community-centre',
  'toronto-city-hall-podium-roof',
  'toronto-panam-sports-centre',
  'toronto-police-services-11-division-precinct',
  'toronto-police-services-training-academy',
  'toronto-rooftop-bench',
  'trillium-health-cancer-care',
  'university-of-toronto-mississauga-utm-instructional-centre',
  'university-of-western-ontario-spencer-engineering-building',
  'victoria-park-station-ttc',
  'water-garden-pavillion-at-arthurs-landing',
  'waterworks',
  'waverley-residence',
  'windsor-family-credit-union-centre',
  'yorkdale-mall',
]

function normalize(str) {
  return str
    .replace(/_/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function findMatchingSlug(folderName) {
  const normalizedFolder = normalize(folderName)
  let bestMatch = null
  let bestMatchLength = 0
  for (const slug of PROJECT_SLUGS) {
    const normalizedSlug = normalize(slug)
    if (
      normalizedFolder === normalizedSlug ||
      normalizedFolder.startsWith(normalizedSlug + '-')
    ) {
      if (normalizedSlug.length > bestMatchLength) {
        bestMatch = slug
        bestMatchLength = normalizedSlug.length
      }
    }
  }
  return bestMatch
}

function uploadImage(filePath, filename) {
  const fileData = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg'

  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2021-03-25/assets/images/${DATASET}?filename=${encodeURIComponent(filename)}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': fileData.length,
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(parsed.document._id)
          } else {
            reject(new Error(`Upload failed (${res.statusCode}): ${data}`))
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`))
        }
      })
    })
    req.on('error', reject)
    req.write(fileData)
    req.end()
  })
}

function patchProject(documentId, photos) {
  const body = JSON.stringify({
    mutations: [{patch: {id: documentId, set: {photos}}}],
  })
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2021-03-25/data/mutate/${DATASET}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode === 200) {
            resolve(parsed)
          } else {
            reject(new Error(`Patch failed (${res.statusCode}): ${data}`))
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const folders = fs
    .readdirSync(PHOTOS_DIR)
    .filter(f => fs.statSync(path.join(PHOTOS_DIR, f)).isDirectory())

  console.log(`Found ${folders.length} project folders\n`)

  let updated = 0
  const unmatched = []

  for (const folder of folders) {
    const slug = findMatchingSlug(folder)
    if (!slug) {
      unmatched.push(folder)
      console.log(`  NO MATCH: ${folder}`)
      continue
    }

    const documentId = `project-${slug}`
    const folderPath = path.join(PHOTOS_DIR, folder)
    const imageFiles = fs
      .readdirSync(folderPath)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
      .sort()

    if (imageFiles.length === 0) {
      console.log(`  SKIP (no images): ${folder}`)
      continue
    }

    console.log(`${folder}`)
    console.log(`  -> ${documentId} (${imageFiles.length} photo${imageFiles.length > 1 ? 's' : ''})`)

    const photos = []
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i]
      const imagePath = path.join(folderPath, imageFile)
      process.stdout.write(`  Uploading ${imageFile}... `)
      try {
        const assetId = await uploadImage(imagePath, imageFile)
        photos.push({
          _key: `photo-${Date.now()}-${i}`,
          image: {
            _type: 'image',
            asset: {_type: 'reference', _ref: assetId},
          },
          caption: '',
          isMain: i === 0,
        })
        console.log(`done`)
      } catch (err) {
        console.log(`FAILED: ${err.message}`)
      }
    }

    if (photos.length > 0) {
      process.stdout.write(`  Saving to Sanity... `)
      try {
        await patchProject(documentId, photos)
        console.log(`done`)
        updated++
      } catch (err) {
        console.log(`FAILED: ${err.message}`)
      }
    }

    console.log()
  }

  console.log(`\nDone: ${updated}/${folders.length} projects updated`)
  if (unmatched.length > 0) {
    console.log(`Unmatched folders (${unmatched.length}):`)
    unmatched.forEach(f => console.log(`  - ${f}`))
  }
}

main().catch(console.error)
