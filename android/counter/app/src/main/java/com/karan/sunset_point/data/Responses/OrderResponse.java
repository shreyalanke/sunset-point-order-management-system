package com.karan.sunset_point.data.Responses;

import java.util.ArrayList;
import java.util.List;

public class OrderResponse {
    public int id;
    public List<OrderItemResponse> items = new ArrayList<>();
    public String tag;
    public String createdAt;
    public String status;
    public boolean paymentDone;
    public int orderTotal;
}
