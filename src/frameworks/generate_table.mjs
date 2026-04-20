/**
 * @typedef {Object} InformationSchemaType
 * @property {string} COLUMN_KEY
 * @property {string} COLUMN_DEFAULT
 * @property {string} COLUMN_NAME
 * @property {string} COLUMN_TYPE
 * @property {string} DATA_TYPE
 * @property {('YES'|'NO')} IS_NULLABLE
 * @property {string} EXTRA
 */

/**
 * @param {string} name
 * @param {InformationSchemaType[]} columns
 * @param {string} prefix
 * @returns {string}
 */
function generateTableTypeScriptCode(name, columns, prefix) {
  const columnTypes = {
    char: "string",
    varchar: "string",
    text: "string",
    int: "number",
    float: "number",
    tinyint: "number",
    smallint: "number",
    bigint: "number",
    date: "string",
    datetime: "string",
    decimal: "string",
    mediumtext: "string",
    longtext: "string",
    timestamp: "number",
    json: "any",
  };

  const finalPrefix = prefix ? `${prefix}_` : "";
  let result = `export interface table_${finalPrefix}${name} {`;

  for (const column of columns) {
    let type = "";
    if (column.DATA_TYPE === "enum") {
      type = column.COLUMN_TYPE.slice(5, column.COLUMN_TYPE.length - 1)
        .split(",")
        .join(" | ");
    } else {
      type = columnTypes[column.DATA_TYPE];
      if (column.IS_NULLABLE === "YES") type += " | null";
    }
    const shouldUndefine =
      (column.COLUMN_KEY === "PRI" && column.EXTRA === "auto_increment") ||
      column.COLUMN_DEFAULT;

    result += "\r";
    result += `  ${column.COLUMN_NAME}${shouldUndefine ? "?" : ""}: ${type};`;
  }

  return result + "\r}\r";
}

/**
 * @param {import('mysql2/promise').Connection} conn
 * @param {string} db
 * @param {string} name
 * @param {string} prefix
 * @returns {Promise<string>}
 */
async function generateTableCreationCode(conn, db, name, prefix) {
  const sql =
    "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?;";
  const rows = (await conn.query(sql, [db, name]))[0];

  if (rows.length === 0) throw "Table does not exist";

  return generateTableTypeScriptCode(name, rows, prefix);
}

/**
 * @param {import('mysql2/promise').Connection} conn
 * @returns {Promise<string>}
 */
async function getCurrentDatabaseName(conn) {
  const rows = (await conn.query("SELECT DATABASE() AS name;"))[0];
  return rows[0].name;
}

export { generateTableCreationCode, getCurrentDatabaseName };
