const got = require('got');
const fs = require('fs');
const path = require('path');
const {localsCollector} = require("./scanners/locals_collector")
const constants = require("./constants")

export async function publish({apiUrl, tfWorkingDir, tfPlan, tfGraph, collectionToken, metadata}) {
  const workingDir = tfWorkingDir.replace(/\/$/, '')

  const modulesPath = path.normalize(`${workingDir}/.terraform/modules/modules.json`);
  let modules = {}
  if (fs.existsSync(modulesPath)) {
    modules = JSON.parse(fs.readFileSync(modulesPath, "utf8"));
  }
  const locals = {};

  if (!modules.Modules)
    modules["Modules"] = [];

  modules["Modules"].push({
    Key: "root_module",
    Source: "root_module",
    Dir: "./"
  });

  modules.Modules.filter((module) => module.Key && module.Dir && module.Source)
    .filter(module => fs.existsSync(path.normalize(`${workingDir}/${module.Dir}`)))
    .forEach((module) => {
      fs.readdirSync(path.normalize(`${workingDir}/${module.Dir}`)).forEach((fileName) => {
        const fileExtension = path.parse(fileName).ext;
        if (fileExtension !== ".tf") return;

        const filePath = `${workingDir}/${module.Dir}/${fileName}`;
        const moduleContent = fs.readFileSync(filePath, "utf8");

        function addData(type) {
          function innerAddData(data) {
            if (!locals[type][module.Source]) locals[type][module.Source] = []
            locals[type][module.Source].push(data);
          }
          return innerAddData
        }

        const localsProcessor = localsCollector(addData('locals'))

        moduleContent.split("\n").forEach((line) => {
          localsProcessor(line)
        })
      });
    });

  const plan = JSON.parse(fs.readFileSync(tfPlan, 'utf8'))
  removeAwsCredentials(plan)
  let graph
  if (tfGraph) {
    graph = fs.readFileSync(tfGraph, 'utf8')
  }

  const publishUrl = `https://${apiUrl}${constants.PublishEndpoint}`
  const headers = {
    [constants.LightlyticsTokenKey]: collectionToken
  }

  const data = {
    locals,
    plan,
    graph,
    metadata,
  }

  const response = await got.post(publishUrl, {
    json: data,
    responseType: 'json',
    headers
  })

  const eventId = response.body.eventId
  const customerId = response.body.customerId

  return {eventId, customerId}
}


function removeAwsCredentials(plan) {
  if (plan && plan.configuration && plan.configuration.provider_config && plan.configuration.provider_config.aws && plan.configuration.provider_config.aws.expressions) {
    delete plan['configuration']['provider_config']['aws']['expressions']['access_key']
    delete plan['configuration']['provider_config']['aws']['expressions']['secret_key']
  }
}
