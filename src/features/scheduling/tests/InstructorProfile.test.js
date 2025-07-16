import { jsx as _jsx } from "react/jsx-runtime";
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InstructorProfile from '../pages/InstructorProfile';
describe('InstructorProfile Component', () => {
    test('renders instructor profile page', () => {
        render(_jsx(BrowserRouter, { children: _jsx(InstructorProfile, {}) }));
        // Check if the page contains the header
        expect(screen.getByText(/Instructor Not Found/i)).toBeInTheDocument();
    });
    test('handles booking logic', async () => {
        render(_jsx(BrowserRouter, { children: _jsx(InstructorProfile, {}) }));
        // Simulate booking button click
        const bookButton = screen.getByText(/Book Now/i);
        fireEvent.click(bookButton);
        // Check for booking confirmation
        expect(await screen.findByText(/Successfully booked/i)).toBeInTheDocument();
    });
});
