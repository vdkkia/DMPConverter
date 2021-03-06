const data = require("../config/data");
const startLine = 16;
const charCount = 50;
let answers = {};
let answerSealed = true;
const replace = async (content, funder) => {
  const parsed = isJson(content);
  if (parsed) {
    let temp = [];
    parsed.sections.forEach((x) => {
      x.questions.forEach((y) =>
        temp.push({
          question: y.text,
          answer: y.answer && y.answer.text ? y.answer.text.replace(/<\/?[^>]+(>|$)/g, "") : null,
        })
      );
    });
    temp.forEach((x) => {
      answers[Object.keys(data.Questions).find((a) => data.Questions[a] == x.question)] = x.answer
        ? x.answer.split("\n")
        : [];
    });
  } else {
    let sealingTexts = await extractSealing(content);
    for (const key in data.Questions) {
      answers[key] = [];
    }
    const lines = content.split("\n");
    let key = "";
    for (let i = startLine; i < lines.length - 1; i++) {
      for (const q in data.Questions) {
        if (lines[i].substring(0, charCount).trim() == data.Questions[q].substring(0, charCount).trim()) {
          // Start of answer
          key = q;
          answerSealed = false;
          i++;
          break;
        }
      }
      if (!answerSealed) {
        if (sealingTexts.includes(lines[i])) {
          answerSealed = true;
        } else {
          // Continue adding lines as answer until next question
          if (lines[i].trim()) answers[key].push(lines[i].trim());
        }
      }
    }
  }

  // console.log(answers);

  let outputHtml = {},
    prevQ = "";
  outputHtml["sections"] = {};
  const root = data[funder].sections;
  for (const section in root) {
    let newSection = unCamelCase(section);
    outputHtml["sections"][newSection] = [];
    for (const funderQ in root[section]) {
      let Q, guide;
      if (Array.isArray(root[section][funderQ])) {
        Q = root[section][funderQ][0];
        guide = "• " + root[section][funderQ][1] + "૾";
      } else Q = root[section][funderQ];

      if (Q == prevQ) {
        lastItem(outputHtml["sections"][newSection]).A += guide
          ? guide + answers[funderQ].join("\n") + "\n"
          : "\n" + answers[funderQ].join("\n") + "\n";
      } else {
        outputHtml["sections"][newSection].push({
          Q: Q,
          A: guide ? guide + answers[funderQ].join("\n") + "\n" : answers[funderQ].join("\n") + "\n",
        });
      }
      prevQ = Q;
    }
  }
  outputHtml["funder"] = funder.toUpperCase();
  // console.log("outputHtml",outputHtml);
  return outputHtml;
};
const lastItem = (array) => {
  return array[array.length - 1];
};
const extractSealing = (content) => {
  let sealingTexts = [];
  const lines = content.split("\n");
  let prevLine = "";
  for (const l in lines) {
    if (lines[l].includes("====") || lines[l].includes("----")) {
      sealingTexts.push(prevLine);
      sealingTexts.push(lines[l]);
    } else prevLine = lines[l];
  }
  return sealingTexts;
};

const unCamelCase = (str) => {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
    return str.toUpperCase();
  });
};

const isJson = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
};

module.exports = replace;
