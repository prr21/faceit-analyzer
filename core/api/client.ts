import axios, { type AxiosInstance } from "axios"

const BASE_URL = "https://open.faceit.com/data/v4"

export function createFaceitClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${apiKey}` },
  })
}
