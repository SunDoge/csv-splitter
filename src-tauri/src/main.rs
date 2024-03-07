// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;

use std::{
    fs::File,
    io::{BufRead, BufReader, BufWriter, Write},
    path::{Path, PathBuf},
};

use error::Result;
use tauri_plugin_aptabase::EventTracker;

#[tauri::command]
async fn split_csv(path: String, num_lines: usize, num_header_lines: usize) -> Result<usize> {
    if num_lines == 0 {
        return Err("num lines cannot be 0".into());
    }

    let path = PathBuf::from(path);

    let mut lines = BufReader::new(File::open(&path)?).lines();

    let header: Vec<String> = (&mut lines)
        .take(num_header_lines)
        .collect::<std::io::Result<Vec<_>>>()?;

    let mut file_index = 1;
    'main: loop {
        let out_path = generate_output_file_path(&path, file_index);
        let mut writer = BufWriter::new(File::create(&out_path)?);

        for line in header.iter() {
            writeln!(writer, "{}", line)?;
        }

        for _ in 0..num_lines {
            match lines.next() {
                Some(line) => {
                    let line = line?;
                    writeln!(writer, "{}", &line)?;
                }
                None => break 'main,
            }
        }
        file_index += 1;
    }

    Ok(file_index)
}

fn generate_output_file_path(path: &Path, index: usize) -> PathBuf {
    let file_stem = path.file_stem().unwrap();
    let extension = path.extension().unwrap();
    let out_file_name = format!(
        "{}-{}.{}",
        file_stem.to_str().unwrap(),
        index,
        extension.to_str().unwrap()
    );
    path.parent().unwrap().join(out_file_name)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_aptabase::Builder::new("A-EU-0495934167").build())
        .setup(|app| {
            app.track_event("app_started", None);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![split_csv])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|handler, event| match event {
            tauri::RunEvent::Exit => {
                handler.track_event("app_exited", None);
                handler.flush_events_blocking();
            }
            _ => {}
        });
}
