fn main() {
    // 请将 `nodim` 替换为 Cargo.toml 中定义的 crate 名称
    if let Err(e) = nodim::run() {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}