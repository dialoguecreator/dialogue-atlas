use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_nodes_table",
            sql: "
                CREATE TABLE IF NOT EXISTS nodes (
                    id TEXT PRIMARY KEY,
                    parent_id TEXT,
                    title TEXT NOT NULL DEFAULT 'Untitled',
                    kind TEXT NOT NULL DEFAULT 'doc',
                    icon TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    doc_content TEXT,
                    canvas_content TEXT,
                    view_mode TEXT NOT NULL DEFAULT 'doc',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    deleted_at INTEGER,
                    remote_id TEXT,
                    dirty INTEGER NOT NULL DEFAULT 1,
                    FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
                CREATE INDEX IF NOT EXISTS idx_nodes_dirty ON nodes(dirty);
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_share_links_table",
            sql: "
                CREATE TABLE IF NOT EXISTS share_links (
                    id TEXT PRIMARY KEY,
                    node_id TEXT NOT NULL,
                    recipient_email TEXT NOT NULL,
                    token TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL,
                    revoked_at INTEGER,
                    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_share_links_node ON share_links(node_id);
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_settings_table",
            sql: "
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_file_columns",
            sql: "
                ALTER TABLE nodes ADD COLUMN file_mime TEXT;
                ALTER TABLE nodes ADD COLUMN file_name TEXT;
                ALTER TABLE nodes ADD COLUMN file_data TEXT;
                ALTER TABLE nodes ADD COLUMN file_size INTEGER;
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:dialogue-atlas.db", migrations)
                .build(),
        )
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Dialogue Atlas");
}
