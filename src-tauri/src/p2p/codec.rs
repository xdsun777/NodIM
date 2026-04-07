use async_trait::async_trait;
use futures::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use libp2p::request_response::Codec;

#[derive(Clone)]
pub struct ChatProtocol;
impl AsRef<str> for ChatProtocol {
    fn as_ref(&self) -> &str {
        "/nodim/chat/1"
    }
}

#[derive(Clone, Default)]
pub struct ChatCodec;

#[derive(Debug, Clone)]
pub struct ChatRequest(pub Vec<u8>);
#[derive(Debug, Clone)]
pub struct ChatResponse(pub Vec<u8>);

#[async_trait]
impl Codec for ChatCodec {
    type Protocol = ChatProtocol;
    type Request = ChatRequest;
    type Response = ChatResponse;

    async fn read_request<T: AsyncRead + Unpin + Send>(&mut self, _: &Self::Protocol, io: &mut T) -> std::io::Result<Self::Request> {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatRequest(buf))
    }
    async fn read_response<T: AsyncRead + Unpin + Send>(&mut self, _: &Self::Protocol, io: &mut T) -> std::io::Result<Self::Response> {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatResponse(buf))
    }
    async fn write_request<T: AsyncWrite + Unpin + Send>(&mut self, _: &Self::Protocol, io: &mut T, ChatRequest(data): ChatRequest) -> std::io::Result<()> {
        io.write_all(&data).await
    }
    async fn write_response<T: AsyncWrite + Unpin + Send>(&mut self, _: &Self::Protocol, io: &mut T, ChatResponse(data): ChatResponse) -> std::io::Result<()> {
        io.write_all(&data).await
    }
}