import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import EmailService from '../../../../../services/emailService';
const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [newTransaction, setNewTransaction] = useState({
        userEmail: '',
        amount: 0,
        date: '',
    });
    const handleAddTransaction = async () => {
        const transaction = {
            id: Date.now().toString(),
            userEmail: newTransaction.userEmail,
            amount: newTransaction.amount,
            date: newTransaction.date,
            status: 'Completed',
        };
        setTransactions([...transactions, transaction]);
        // Generate and send invoice email
        const invoiceHtml = `
      <h1>Invoice</h1>
      <p>Thank you for your payment.</p>
      <p>Amount: $${transaction.amount}</p>
      <p>Date: ${transaction.date}</p>
    `;
        try {
            await EmailService.simulateEmailSend({
                to: transaction.userEmail,
                subject: 'Your Invoice',
                html: invoiceHtml,
            });
            alert('Invoice sent successfully!');
        }
        catch (error) {
            console.error('Failed to send invoice:', error);
            alert('Failed to send invoice.');
        }
    };
    return (_jsxs("div", { children: [_jsx("h1", { children: "Transaction Management" }), _jsxs("div", { children: [_jsx("h2", { children: "Add Transaction" }), _jsx("input", { type: "email", placeholder: "User Email", value: newTransaction.userEmail, onChange: (e) => setNewTransaction({ ...newTransaction, userEmail: e.target.value }) }), _jsx("input", { type: "number", placeholder: "Amount", value: newTransaction.amount, onChange: (e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) }) }), _jsx("input", { type: "date", value: newTransaction.date, onChange: (e) => setNewTransaction({ ...newTransaction, date: e.target.value }) }), _jsx("button", { onClick: handleAddTransaction, children: "Add Transaction" })] }), _jsxs("div", { children: [_jsx("h2", { children: "Transactions" }), _jsx("ul", { children: transactions.map((transaction) => (_jsxs("li", { children: [transaction.userEmail, " - $", transaction.amount, " - ", transaction.date, " - ", transaction.status] }, transaction.id))) })] })] }));
};
export default TransactionManagement;
