import got from "got"
import * as constants from "./constants.js"

export async function poll({apiUrl, collectionToken, eventId}) {
  const publishUrl = `https://${apiUrl}${constants.PollingEndpoint}/${eventId}`
  const headers = {
    [constants.LightlyticsTokenKey]: collectionToken,
  }

  const response = await got.get(publishUrl, {
    responseType: "json",
    headers,
  });

  return response.body
}