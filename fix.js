const fs = require('fs');
let code = fs.readFileSync('src/app/t/[track]/test/reading/page.tsx', 'utf8');

code = code.replace(
  /{psg\.matchingQuestions\[0\]\.number\.replace/g, 
  '{psg.matchingQuestions[0]?.number?.replace'
);

code = code.replace(
  /psg\.matchingQuestions\[psg\.matchingQuestions\.length-1\]\.number\.replace/g,
  'psg.matchingQuestions[psg.matchingQuestions.length-1]?.number?.replace'
);

code = code.replace(
  /{psg\.tfQuestions\[0\]\.number\.replace/g, 
  '{psg.tfQuestions[0]?.number?.replace'
);

code = code.replace(
  /psg\.tfQuestions\[psg\.tfQuestions\.length-1\]\.number\.replace/g,
  'psg.tfQuestions[psg.tfQuestions.length-1]?.number?.replace'
);

// We still need to wrap the whole card in conditional, but actually optional chaining prevents the error!
// Wait, if the array is empty, we shouldn't render the card at all.
// So let's replace the card start:
code = code.replace(
  /\{\/\* Matching questions for this passage \*\/\}\s*<div style=\{cardStyle\}/g,
  '{/* Matching questions for this passage */}\n                      {psg.matchingQuestions?.length > 0 && (\n                      <div style={cardStyle}'
);

// We need to find the end of matching questions card. 
// It ends exactly before {/* TF/NG questions for this passage */}
code = code.replace(
  /<\/div>\s*<\/div>\s*\{\/\* TF\/NG questions for this passage \*\/\}/g,
  '</div>\n                      </div>\n                      )}\n\n                      {/* TF/NG questions for this passage */}'
);

// And for TF questions card:
code = code.replace(
  /\{\/\* TF\/NG questions for this passage \*\/\}\s*<div style=\{cardStyle\}/g,
  '{/* TF/NG questions for this passage */}\n                      {psg.tfQuestions?.length > 0 && (\n                      <div style={cardStyle}'
);

// It ends exactly before </div>\n                  )) (but with an extra </div>)
// Let's just do a regex that finds the end of tfQuestions loop
code = code.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\)\)\s*\)\}/g,
  '</div>\n                      </div>\n                      )}\n                    </div>\n                  ))\n                )}'
);

fs.writeFileSync('src/app/t/[track]/test/reading/page.tsx', code);
