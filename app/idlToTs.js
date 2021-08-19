import { watch, readdir, readFile, writeFile } from 'fs/promises';

const idl = "./target/idl/";

const fieldToType = {
  publicKey: "PublicKey",
  u64: "BN",
  u32: "number",
  u16: "number",
  u8: "number",
  i64: "BN"
}

function primitiveFieldToTs(field) {
  return `${field.name}: ${fieldToType[field.type]};`
}

function enumVariantToTs(variant) {
  return `${variant.name}: { ${variant.name.toLowerCase()}: {} }`
}

function structToTs(struct) {
  const structFields = (struct.type.fields || []).filter(f => !!f.type.defined)
  const primitiveFields = (struct.type.fields || []).filter(f => typeof f.type === "string");
  const enumVariants = struct.type.variants;
  if (enumVariants) {
    return `export type ${struct.name} = Record<string, Record<string, any>>
export const ${struct.name} = {
  ${enumVariants.map(enumVariantToTs).join(",\n  ")}
}
    `
  }
  return `export interface ${struct.name} {
  ${structFields.map(f => `${f.name}: ${f.type.defined};`).join("\n  ")}
  ${primitiveFields.map(primitiveFieldToTs).join("\n  ")}
}
  `
}

function accountClient(acc) {
  return `export class ${acc.name}AccountClient extends AccountClient {
  override async fetch(address: Address): Promise<${acc.name}> {
    return (await this.fetch(address)) as ${acc.name};
  }

  parse(accountInfo: AccountInfo<Buffer>): ${acc.name} {
    return this.coder.accounts.decode("${acc.name}", accountInfo.data);
  }

  override async all(filter?: Buffer): Promise<ProgramAccount<${acc.name}>[]> {
    return (await this.all(filter)).map(programAccount => ({
      ...programAccount,
      account: programAccount.account as ${acc.name}
    }))
  }
}
  `
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function lowerFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function toTs(name, idlDef) {
  const camelName = capitalizeFirstLetter(name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }));
  return `import { PublicKey, AccountInfo } from "@solana/web3.js";
import { ProgramAccount , Address, Program, AccountNamespace, AccountClient } from "@project-serum/anchor";
import BN from "bn.js";

${idlDef.types.map(structToTs).join("\n\n")}
${idlDef.accounts.map(structToTs).join("\n\n")}

${idlDef.accounts.map(accountClient).join("\n\n")}

export interface ${camelName}AccountNamespace  extends AccountNamespace {
  ${idlDef.accounts.map(acc => `${lowerFirstLetter(acc.name)}: ${acc.name}AccountClient`).join(";\n  ")}
}

export interface ${camelName}Program extends Program {
  account: ${camelName}AccountNamespace
}
  `
}

(async () => {
  const files = await readdir(idl);
  await Promise.all(
    files.map(async (filename) => {
      try {
        const path = `${idl}${filename}`
        const watcher = watch(path);
        async function generate() {
          const rawdata = await readFile(path);
          const idlDef = JSON.parse(rawdata.toString());
          console.log(`Change in ${path}`)
          const name = filename.replace(".json", "").replace(/\_/g, "-");
          writeFile(`./packages/${name}/src/generated/${name}.ts`, toTs(name, idlDef));
        }
        await generate()
        for await (const event of watcher) {
          await generate()
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log("Aborted")
          console.log(err);
          return;
        } else {
          throw err;
        }
      }
    })
  )
})();
