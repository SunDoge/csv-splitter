// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;

use std::{
    fs::File,
    io::{BufRead, BufReader, BufWriter, Write},
    path::{Path, PathBuf},
};

use error::Result;

#[tauri::command]
async fn split_csv(path: String, num_lines: usize, with_header: bool) -> Result<usize> {
    if num_lines == 0 {
        return Err("num lines cannot be 0".into());
    }

    let path = PathBuf::from(path);

    let mut lines = BufReader::new(File::open(&path)?).lines();

    let header = if with_header {
        Some(lines.next().unwrap()?)
    } else {
        None
    };

    let mut file_index = 1;
    let out_path = generate_output_file_path(&path, file_index);
    let mut writer = BufWriter::new(File::create(&out_path)?);

    'main: loop {
        if let Some(header) = &header {
            writeln!(writer, "{}", header)?;
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
        let out_path = generate_output_file_path(&path, file_index);
        writer = BufWriter::new(File::create(&out_path)?);
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
        .invoke_handler(tauri::generate_handler![split_csv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
