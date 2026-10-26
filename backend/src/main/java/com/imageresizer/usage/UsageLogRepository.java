package com.imageresizer.usage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {

    /** Count AI calls made by a registered user since {@code since}. */
    @Query("SELECT COUNT(u) FROM UsageLog u WHERE u.userId = :userId AND u.usedAt >= :since")
    long countByUserIdSince(@Param("userId") Long userId, @Param("since") Instant since);

    /** Count AI calls made from an IP address (for anonymous users) since {@code since}. */
    @Query("SELECT COUNT(u) FROM UsageLog u WHERE u.ipAddress = :ip AND u.userId IS NULL AND u.usedAt >= :since")
    long countByIpSince(@Param("ip") String ip, @Param("since") Instant since);
}
