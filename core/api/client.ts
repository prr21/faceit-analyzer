import axios, { type AxiosInstance } from "axios"

export type FaceitClient = AxiosInstance

const BASE_URL = "https://open.faceit.com/data/v4"

export function createFaceitClient(apiKey: string): FaceitClient {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${apiKey}` },
  })
}
