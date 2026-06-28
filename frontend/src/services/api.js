import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL: BASE, timeout: 120_000 })

export async function uploadParcels(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/parcels/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function analyzeParcels(parcelId, centroidLat, centroidLon, geometry) {
  const { data } = await client.post('/analysis', {
    parcel_id: parcelId,
    centroid_lat: centroidLat,
    centroid_lon: centroidLon,
    geometry: geometry || null,
  })
  return data
}
