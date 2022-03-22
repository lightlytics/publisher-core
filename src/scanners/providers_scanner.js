export function providersScanner(addData) {
  let blockCnt = 0;
  let providersBlockLines = "";
  let moduleName = "";
  let providers = false;

  function processLine(line) {
    const sanitizedLine = String(line).trim();
    if (sanitizedLine.startsWith("#")) return;

    if (sanitizedLine.startsWith("module ")) {
      moduleName = sanitizedLine.match(/"([^"]+)"/)[1];
      blockCnt = 1;
    }

    else if (blockCnt > 0 && sanitizedLine.includes("{")){
      blockCnt+=(sanitizedLine.match(/{/g) || []).length;
    }

    if (blockCnt > 0 && sanitizedLine.startsWith("providers = {")) {
      providers = true;
      providersBlockLines = "";
    }

    else if (providers && ! sanitizedLine.includes("}")) {
      providersBlockLines += line;
    }

    if (blockCnt > 0 && sanitizedLine.includes("}")) {
      blockCnt-=(sanitizedLine.match(/}/g) || []).length;
      providers = false
      if (blockCnt === 0 &&  providersBlockLines) {
        const output = {}
        output[moduleName] = providersBlockLines
        addData(output);
      }
    }
  }
  return processLine;
}
