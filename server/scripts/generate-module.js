import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [folderName, singularName] = process.argv.slice(2);

if (!folderName || !singularName) {
    throw new Error("Usage: npm run module:new -- <plural-folder> <singular-name>");
}

if (!/^[a-z][a-z0-9-]*$/.test(folderName) || !/^[a-z][a-z0-9-]*$/.test(singularName)) {
    throw new Error("Module names must be lowercase kebab-case.");
}

const directory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "modules",
    folderName
);
const className = singularName.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase());
const baseName = singularName;

const files = {
    [`${baseName}.controller.js`]: `import ${baseName}Service from "./${baseName}.service.js";\n\nexport default {};\n`,
    [`${baseName}.service.js`]: `import ${baseName}Repository from "./${baseName}.repository.js";\n\nclass ${className}Service {\n    constructor() {\n        this.repository = ${baseName}Repository;\n    }\n}\n\nexport default new ${className}Service();\n`,
    [`${baseName}.repository.js`]: `import BaseRepository from "../../shared/repositories/base.repository.js";\n\nclass ${className}Repository extends BaseRepository {}\n\nexport default new ${className}Repository();\n`,
    [`${baseName}.routes.js`]: `import { Router } from "express";\n\nconst router = Router();\n\nexport default router;\n`,
    [`${baseName}.validation.js`]: "export {};\n",
    [`${baseName}.mapper.js`]: `const to${className}Dto = (value) => value;\n\nexport default to${className}Dto;\n`,
    [`${baseName}.constants.js`]: `export const ${baseName.replace(/-/g, "_").toUpperCase()}_CONSTANTS = Object.freeze({});\n`,
    [`${baseName}.permissions.js`]: `import { ADMIN_ROLES, MEMBER_ROLES, OWNER_ROLES } from "../../constants/roles.js";\n\nexport const ${baseName.replace(/-/g, "_").toUpperCase()}_PERMISSIONS = Object.freeze({\n    CREATE: ADMIN_ROLES,\n    UPDATE: ADMIN_ROLES,\n    DELETE: OWNER_ROLES,\n    VIEW: MEMBER_ROLES,\n});\n`,
    [`${baseName}.events.js`]: `export const ${baseName.replace(/-/g, "_").toUpperCase()}_EVENTS = Object.freeze({});\n`,
    [`${baseName}.swagger.js`]: `export const ${baseName}Swagger = Object.freeze({ tags: ["${className}"] });\n`,
    "index.js": `export { default as routes } from "./${baseName}.routes.js";\nexport { default as service } from "./${baseName}.service.js";\nexport { default as repository } from "./${baseName}.repository.js";\nexport { default } from "./${baseName}.routes.js";\n`,
};

const testFiles = ["controller", "service", "repository", "routes"];

await mkdir(path.join(directory, "tests"), { recursive: true });

for (const [filename, content] of Object.entries(files)) {
    const target = path.join(directory, filename);
    try {
        await access(target, constants.F_OK);
    } catch {
        await writeFile(target, content);
    }
}

for (const type of testFiles) {
    const target = path.join(directory, "tests", `${baseName}.${type}.test.js`);
    try {
        await access(target, constants.F_OK);
    } catch {
        await writeFile(target, `test.todo("add ${baseName} ${type} coverage");\n`);
    }
}

console.log(`Created module template: src/modules/${folderName}`);
