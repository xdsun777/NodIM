mod lib;
use lib::app_run;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    app_run().await
}