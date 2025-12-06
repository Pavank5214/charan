# TODO: Fix Typing Issue in Settings

## Completed Tasks
- [x] Analyze the typing issue in settings where users need to reselect after each character
- [x] Identify potential cause: input components losing focus due to unstable keys and re-rendering
- [x] Move Input component outside the component and wrap with React.memo in BusinessSettingsTab.jsx
- [x] Move Input component outside the component and wrap with React.memo in InvoiceSettingsTab.jsx
- [x] Move Input component outside the component and wrap with React.memo in QuotationSettingsTab.jsx

## Summary
The issue was caused by the Input component being redefined on every render inside the parent component, leading to React treating it as a new component each time and causing focus loss. By moving the Input component outside the component and wrapping it with React.memo, we prevent unnecessary re-renders and maintain focus during typing.
