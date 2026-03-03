-- V15__update_event_signup_and_remove_html.sql

UPDATE events 
SET title = '[신규가입 혜택] 회원가입 즉시 5,000P 100% 지급',
    content = 'MyCard 오픈을 기념하여 신규 가입하신 모든 회원님들께 5,000P를 즉시 지급해 드립니다!\r\n\r\n지급된 포인트는 e쿠폰 교환 또는 결제 시 현금처럼 사용할 수 있습니다. 지금 바로 혜택을 누려보세요!\r\n\r\n* 본 이벤트는 당사 사정에 의해 사전 고지 없이 조기 종료될 수 있습니다.\r\n* 탈퇴 후 재가입 시 혜택이 중복 지급되지 않습니다.'
WHERE id = 20000;
