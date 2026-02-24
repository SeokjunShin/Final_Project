package com.mycard.api.repository;

import com.mycard.api.entity.InquiryReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryReplyRepository extends JpaRepository<InquiryReply, Long> {

    List<InquiryReply> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
}
