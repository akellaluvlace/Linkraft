"use strict";
// Schema Extractor: reads migration files, Prisma schema, or Drizzle schema.
// Produces a SCHEMA.md with tables, columns, types, relationships.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSchema = extractSchema;
exports.formatSchema = formatSchema;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detects and extracts database schema from the project.
 */
function extractSchema(projectRoot) {
    // Try Prisma
    const prismaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaPath)) {
        return { tables: parsePrismaSchema(fs.readFileSync(prismaPath, 'utf-8')), source: 'prisma' };
    }
    // Try SQL migrations
    const migrationDirs = [
        path.join(projectRoot, 'supabase', 'migrations'),
        path.join(projectRoot, 'prisma', 'migrations'),
        path.join(projectRoot, 'migrations'),
        path.join(projectRoot, 'drizzle'),
    ];
    for (const dir of migrationDirs) {
        if (fs.existsSync(dir)) {
            const sqlFiles = findSqlFiles(dir);
            if (sqlFiles.length > 0) {
                const allSql = sqlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n\n');
                return { tables: parseSqlSchema(allSql), source: path.relative(projectRoot, dir) };
            }
        }
    }
    return null;
}
/**
 * Generates SCHEMA.md content from extracted tables.
 */
function formatSchema(tables, source) {
    const lines = [`# Database Schema`, `Source: ${source}`, ''];
    if (tables.length === 0) {
        lines.push('No tables detected.');
        return lines.join('\n');
    }
    lines.push('## Tables', '');
    for (const table of tables) {
        lines.push(`### ${table.name}`);
        lines.push('| Column | Type | Nullable | Default | Notes |');
        lines.push('|--------|------|----------|---------|-------|');
        for (const col of table.columns) {
            lines.push(`| ${col.name} | ${col.type} | ${col.nullable ? 'yes' : 'no'} | ${col.defaultValue ?? ''} | ${col.notes ?? ''} |`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
function parsePrismaSchema(content) {
    const tables = [];
    const modelRe = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = modelRe.exec(content)) !== null) {
        const name = match[1];
        const body = match[2];
        const columns = [];
        for (const line of body.split('\n')) {
            const fieldMatch = /^\s+(\w+)\s+(\w+)(\??)(.*)/.exec(line);
            if (fieldMatch) {
                const [, colName, colType, nullable, rest] = fieldMatch;
                if (colName && colType) {
                    columns.push({
                        name: colName,
                        type: colType,
                        nullable: nullable === '?',
                        defaultValue: rest?.includes('@default') ? rest.match(/@default\(([^)]+)\)/)?.[1] ?? null : null,
                        notes: rest?.includes('@id') ? 'PK' : (rest?.includes('@unique') ? 'unique' : null),
                    });
                }
            }
        }
        tables.push({ name, columns });
    }
    return tables;
}
function parseSqlSchema(sql) {
    const tables = [];
    const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?(\w+)["']?\s*\(([^;]*?)\)\s*;/gis;
    let match;
    while ((match = createRe.exec(sql)) !== null) {
        const name = match[1];
        const body = match[2];
        const columns = [];
        for (const line of body.split(',')) {
            const trimmed = line.trim();
            if (!trimmed || /^(primary|foreign|unique|check|constraint)/i.test(trimmed))
                continue;
            const colMatch = /^["']?(\w+)["']?\s+(\w+(?:\([^)]*\))?)\s*(.*)/i.exec(trimmed);
            if (colMatch) {
                const [, colName, colType, rest] = colMatch;
                if (colName && colType) {
                    columns.push({
                        name: colName,
                        type: colType,
                        nullable: !rest?.toUpperCase().includes('NOT NULL'),
                        defaultValue: rest?.match(/default\s+(.+?)(?:\s|$)/i)?.[1] ?? null,
                        notes: rest?.toUpperCase().includes('PRIMARY KEY') ? 'PK' : (rest?.toUpperCase().includes('REFERENCES') ? 'FK' : null),
                    });
                }
            }
        }
        if (columns.length > 0)
            tables.push({ name, columns });
    }
    return tables;
}
function findSqlFiles(dir) {
    const results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...findSqlFiles(full));
            }
            else if (entry.name.endsWith('.sql')) {
                results.push(full);
            }
        }
    }
    catch { }
    return results.sort();
}
//# sourceMappingURL=schema-extractor.js.map