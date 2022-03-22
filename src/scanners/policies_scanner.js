export function policiesScanner(addData) {
    let blockCnt = 0;
    let policyBlockLines = "";
    let resourceName = "";
    let policy = false;
  
    function processLine(line) {
      const sanitizedLine = String(line).trim();
      if (sanitizedLine.startsWith("#")) return;
  
      if (sanitizedLine.startsWith("resource")) {
        const splittedLine =  sanitizedLine.split(/["]/)
        resourceName = splittedLine[1].concat(".", splittedLine[3])
        blockCnt = 1;
      }

      else if (blockCnt > 0 && sanitizedLine.includes("{")){
        blockCnt++;
      }
  
      if (blockCnt > 0 && sanitizedLine.includes("policy =")) {
        policy = true;
      }
  
      if (policy) {
        policyBlockLines += line;
      }
  
      if (blockCnt > 0 && sanitizedLine.includes("}")) {
        blockCnt--;
        if (policy && blockCnt === 1){
            policy = false
        }
        if (blockCnt === 0 && policyBlockLines) {
          const output = {}
          output[resourceName] = policyBlockLines
          addData(output);
        }
      }
    }
    return processLine;
  }