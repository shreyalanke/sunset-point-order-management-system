package com.karan.sunset_point.data.entity;

public class OrderWithItemsRow {

    public int order_id;
    public String order_tag;
    public String created_at;
    public String order_status;
    public boolean is_payment_done;
    public int order_total;

    public Integer order_item_id;
    public Integer quantity;
    public String item_status;
    public Integer price;
    public String dish_name;

    public Integer dish_id;
    public String category;
}
