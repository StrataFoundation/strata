"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorshAccountParser = void 0;
const borsh_1 = require("borsh");
function BorshAccountParser(classType, getSchema) {
    return (pubKey, info) => {
        const buffer = Buffer.from(info.data);
        const data = (0, borsh_1.deserializeUnchecked)(getSchema(info.data[0]), classType, buffer);
        return {
            pubkey: pubKey,
            account: Object.assign({}, info),
            info: data,
        };
    };
}
exports.BorshAccountParser = BorshAccountParser;
//# sourceMappingURL=serialisation.js.map