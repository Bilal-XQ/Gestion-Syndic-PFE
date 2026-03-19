const postgres = require("postgres");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("NO_DATABASE_URL");
  process.exit(1);
}
const sql = postgres(url, { ssl: "require" });

(async () => {
  const buildingsCols = await sql`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'buildings'
    order by ordinal_position
  `;

  const fk = await sql`
    select tc.constraint_name, kcu.column_name,
           ccu.table_name as foreign_table,
           ccu.column_name as foreign_column
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
     and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = 'apartments'
      and kcu.column_name = 'building_id'
  `;

  const policies = await sql`
    select schemaname, tablename, policyname, cmd, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename in ('buildings', 'apartments')
    order by tablename, policyname
  `;

  const count = await sql`select count(*)::int as count from public.buildings`;

  console.log(
    JSON.stringify(
      {
        buildingsCols,
        fk,
        policies,
        buildingCount: count[0].count,
      },
      null,
      2
    )
  );

  await sql.end();
})().catch(async (e) => {
  console.error("DB_QUERY_ERROR", e.message);
  process.exit(1);
});
