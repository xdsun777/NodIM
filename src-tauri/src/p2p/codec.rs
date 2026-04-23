use async_trait::async_trait;
use futures::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use libp2p::request_response;

#[derive(Clone)]
pub struct ChatProtocol();

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
impl request_response::Codec for ChatCodec {
    type Protocol = ChatProtocol;
    type Request = ChatRequest;
    type Response = ChatResponse;

    async fn read_request<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatRequest(buf))
    }

    async fn read_response<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatResponse(buf))
    }

    async fn write_request<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        ChatRequest(data): ChatRequest,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        io.write_all(&data).await
    }

    async fn write_response<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        ChatResponse(data): ChatResponse,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        io.write_all(&data).await
    }
}