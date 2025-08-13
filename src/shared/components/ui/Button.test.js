import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { Button } from './Button';
test('renders button with children', () => {
    render(_jsx(Button, { children: "Click me" }));
    const buttonElement = screen.getByText(/Click me/i);
    expect(buttonElement).toBeInTheDocument();
});
