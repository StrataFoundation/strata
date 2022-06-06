const { watch, readdir, readFile, writeFile } = require("fs/promises");
const camelcase = require("camelcase");

const rootDir = `${process.env.PWD}/../..`;
const idl = `${rootDir}/target/idl/`;

function enumVariantToTs(variant) {
  return `${variant.name}: { ${variant.name.toLowerCase()}: {} }`;
}

function enumToTs(struct) {
  const enumVariants = struct.type.variants;
  if (enumVariants) {
    return `export type ${capitalizeFirstLetter(
      struct.name
    )} = Record<string, Record<string, any>>
export const ${capitalizeFirstLetter(struct.name)} = {
  ${enumVariants.map(enumVariantToTs).join(",\n  ")}
}
    `;
  }
}

function allEnumsToTs(idlDef) {
  return `
${idlDef.types.map(enumToTs).filter(Boolean).join("\n\n")}
${idlDef.accounts.map(enumToTs).filter(Boolean).join("\n\n")}
  `;
}

function accountToTs(idlName, account) {
  return `export type ${capitalizeFirstLetter(
    account.name
  )} = IdlAccounts<${idlName}>["${account.name}"]`;
}

function allAccountsToTs(idlName, idlDef) {
  return `
${idlDef.accounts
  .map((a) => accountToTs(idlName, a))
  .filter(Boolean)
  .join("\n\n")}
  `;
}

function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

(async () => {
  const files = await readdir(idl);
  await Promise.all(
    files.map(async (filename) => {
      try {
        const path = `${idl}${filename}`;
        const watcher = watch(path);
        async function generate() {
          const rawdata = await readFile(path);
          console.log(`Change in ${path}`);
          const name = filename.replace(".json", "").replace(/\_/g, "-");
          let idlJson = JSON.parse(rawdata.toString());
          for (let account of idlJson.accounts) {
            account.name = camelcase(account.name);
          }
          const idlName = `${capitalizeFirstLetter(camelcase(name))}IDL`;

          const fileContents = `import { IdlAccounts, Idl } from '@project-serum/anchor';
export const ${idlName}Json: Idl & { metadata?: { address: string } } = ${rawdata.toString()};
export type ${idlName} = ${JSON.stringify(idlJson)};
${allEnumsToTs(idlJson)}
${allAccountsToTs(idlName, idlJson)}
          `;

          writeFile(
            `${rootDir}/packages/${name}/src/generated/${name}.ts`,
            fileContents
          );
        }
        await generate();
        for await (const event of watcher) {
          await generate();
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Aborted");
          console.log(err);
          return;
        } else {
          throw err;
        }
      }
    })
  );
})();
