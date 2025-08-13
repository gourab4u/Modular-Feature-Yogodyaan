import { useState } from 'react';
import EmailService from '../../../../../services/emailService';

interface Transaction {
    id: string;
    userEmail: string;
    amount: number;
    date: string;
    status: 'Pending' | 'Completed';
}

const TransactionManagement = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [newTransaction, setNewTransaction] = useState({
        userEmail: '',
        amount: 0,
        date: '',
    });

    const handleAddTransaction = async () => {
        const transaction: Transaction = {
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
        } catch (error) {
            console.error('Failed to send invoice:', error);
            alert('Failed to send invoice.');
        }
    };

    return (
        <div>
            <h1>Transaction Management</h1>
            <div>
                <h2>Add Transaction</h2>
                <input
                    type="email"
                    placeholder="User Email"
                    value={newTransaction.userEmail}
                    onChange={(e) => setNewTransaction({ ...newTransaction, userEmail: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                />
                <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
                <button onClick={handleAddTransaction}>Add Transaction</button>
            </div>
            <div>
                <h2>Transactions</h2>
                <ul>
                    {transactions.map((transaction) => (
                        <li key={transaction.id}>
                            {transaction.userEmail} - ${transaction.amount} - {transaction.date} - {transaction.status}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TransactionManagement;
