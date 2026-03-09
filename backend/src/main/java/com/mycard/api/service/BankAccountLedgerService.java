package com.mycard.api.service;

import com.mycard.api.entity.BankAccountTransaction;
import com.mycard.api.entity.Loan;
import com.mycard.api.entity.UserBankAccount;
import com.mycard.api.repository.BankAccountTransactionRepository;
import com.mycard.api.repository.UserBankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BankAccountLedgerService {

    private final UserBankAccountRepository userBankAccountRepository;
    private final BankAccountTransactionRepository bankAccountTransactionRepository;

    @Transactional
    public BankAccountTransaction deposit(UserBankAccount account, Loan loan, BigDecimal amount, String description) {
        account.deposit(amount);
        userBankAccountRepository.save(account);
        BankAccountTransaction transaction = new BankAccountTransaction(
                account,
                loan,
                BankAccountTransaction.TransactionType.DEPOSIT,
                amount,
                account.getCurrentBalance(),
                description
        );
        return bankAccountTransactionRepository.save(transaction);
    }
}
