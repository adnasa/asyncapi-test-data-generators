/* eslint-disable security/detect-non-literal-fs-filename */
const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const formatWithPrettier = (dirPath, options) => {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      formatWithPrettier(filePath, options);
    } else {
      const fileData = fs.readFileSync(filePath);
      const beautifiedData = prettier.format(fileData.toString(), options);
      fs.writeFileSync(filePath, beautifiedData);
    }
  });
};

module.exports = {
  'generate:after': (generator) => {
    prettier.resolveConfig(generator.templateDir).then((options) => {
      const testDataFolder = path.resolve(
        generator.targetDir,
        'test-data-generators'
      );
      const schemasFolder = path.resolve(generator.targetDir, 'schemas');

      [testDataFolder, schemasFolder].forEach((folder) =>
        formatWithPrettier(folder, options)
      );
    });
  },
};
