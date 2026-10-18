# Home memory feed implementation

User approved: replace the existing Home with the image-reference feed layout, keep Flamee's warm palette, plus at left, centered title, notification bell at right. Timeline and photo memories are the main content. No mock posts or fabricated author/comment/notification data.

- [x] Add tests for authenticated album reads, failure versus empty and date/gallery presentation.
- [x] Add a read-only adapter for the existing `/memories` contract; do not map legacy Tiny Moments into fake server records or change backend/upload policy.
- [x] Replace Home and its loading state with a fixed header, view filters and a virtualized post feed/photo grid. No old greeting, emotion hero or connection cards.
- [x] Plus/bell open honest availability sheets until create/upload/notifications are ready. Old timeline link forwards to Home; keep other routes/navigation contracts.
- [x] Document current API limitations and run typecheck/domain tests and Android bundle verification. No browser agent, database writes, fake accounts or process restarts.
