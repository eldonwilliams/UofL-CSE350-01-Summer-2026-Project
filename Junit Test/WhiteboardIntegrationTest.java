package com.example.whiteboard;

import com.example.whiteboard.model.DrawMessage;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WhiteboardIntegrationTest {

    @LocalServerPort
    private int port;

    @Test
    void testWebSocketFlow() throws Exception {
        WebSocketStompClient stompClient = new WebSocketStompClient(new SockJsClient(
                List.of(new WebSocketTransport(new StandardWebSocketClient()))));
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());

        String url = "ws://localhost:" + port + "/ws-whiteboard";
        StompSession session = stompClient.connectAsync(url, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);

        BlockingQueue<DrawMessage> subscribeQueue = new LinkedBlockingDeque<>();

        session.subscribe("/topic/canvas", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return DrawMessage.class; }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                subscribeQueue.add((DrawMessage) payload);
            }
        });

        DrawMessage msg = new DrawMessage(DrawMessage.MessageType.START, 50, 50, "#000", 2, "test-client");
        session.send("/app/draw", msg);

        DrawMessage received = subscribeQueue.poll(5, TimeUnit.SECONDS);

        assertNotNull(received);
        assertEquals(msg, received);
    }
}