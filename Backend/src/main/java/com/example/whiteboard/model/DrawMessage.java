package com.example.whiteboard.model;

import java.util.Objects;

public class DrawMessage {
    public enum MessageType {
        START, DRAW, STOP, CLEAR, UNDO, REDO, COLOR_CHANGE
    }

    private MessageType type;
    private double x;
    private double y;
    private String color;
    private int size;
    private String senderId;

    // Constructors
    public DrawMessage() {}

    public DrawMessage(MessageType type, double x, double y, String color, int size, String senderId) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.senderId = senderId;
    }

    // Getters and Setters
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public double getX() { return x; }
    public void setX(double x) { this.x = x; }

    public double getY() { return y; }
    public void setY(double y) { this.y = y; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DrawMessage that = (DrawMessage) o;
        return Double.compare(that.x, x) == 0 &&
                Double.compare(that.y, y) == 0 &&
                size == that.size &&
                type == that.type &&
                Objects.equals(color, that.color) &&
                Objects.equals(senderId, that.senderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, x, y, color, size, senderId);
    }
}