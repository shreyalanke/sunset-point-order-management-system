package com.karan.admin_sunset_point.data.handler;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public class DateRangeUtil {

    private static final DateTimeFormatter SQLITE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static DateRange getDateRange(String range) {
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime start;
        LocalDateTime end = now;

        switch (range) {
            case "Today":
                start = now.toLocalDate().atStartOfDay();
                break;

            case "Yesterday":
                start = now.minusDays(1).toLocalDate().atStartOfDay();
                end = start.with(LocalTime.MAX);
                break;

            case "Last 7 Days":
                start = now.minusDays(7);
                break;

            case "Last 30 Days":
                start = now.minusDays(30);
                break;

            default:
                throw new IllegalArgumentException("Invalid range");
        }

        return new DateRange(
                start.format(SQLITE_FORMAT),
                end.format(SQLITE_FORMAT)
        );
    }

    public static class DateRange {
        public final String start;
        public final String end;

        public DateRange(String start, String end) {
            this.start = start;
            this.end = end;
        }
    }
}
