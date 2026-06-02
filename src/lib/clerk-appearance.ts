// Shared Clerk appearance — one dark, on-brand theme applied globally so the
// UserButton popover, the "Manage account" (UserProfile) modal, and the
// sign-in / sign-up cards all match the Midnight Signal dashboard instead of
// rendering as a stock white Clerk widget.
//
// The brand accent is a clean blue (blue-600 #2563eb), matching
// `--accent` in src/styles/midnight.css. Setting `variables` here is what
// makes the whole Clerk surface dark — Clerk derives its modal, popover and
// form chrome from these tokens. The `elements` overrides then sharpen a few
// high-touch pieces (primary button, popover action rows, footer).

const SURFACE       = '#0c0c16'; // card / popover background
const SURFACE_INPUT = '#13131f'; // inputs

export const clerkAppearance = {
  variables: {
    colorPrimary:         '#2563eb',
    colorText:            '#f3f4f6',
    colorTextSecondary:   '#9aa3b2',
    colorBackground:      SURFACE,
    colorInputBackground: SURFACE_INPUT,
    colorInputText:       '#ffffff',
    colorDanger:          '#ef4444',
    colorSuccess:         '#22c55e',
    colorWarning:         '#f59e0b',
    borderRadius:         '0.7rem',
    fontFamily:           'var(--font-geist-sans), system-ui, sans-serif',
  },
  elements: {
    // Cards / popovers / modals
    card:                       'bg-[#0c0c16] border border-white/[0.08] shadow-2xl shadow-black/60',
    rootBox:                    'text-gray-100',
    modalContent:               'bg-transparent',
    modalCloseButton:           'text-gray-400 hover:text-white',

    // Header
    headerTitle:                'text-white font-semibold',
    headerSubtitle:             'text-gray-400',

    // Primary action — brand blue gradient, matches dashboard CTAs
    formButtonPrimary:
      'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 normal-case',
    formFieldInput:
      'bg-[#13131f] border border-white/10 text-white rounded-xl focus:border-blue-500/60 focus:ring-blue-500/20',
    formFieldLabel:             'text-gray-300 font-medium',
    formFieldAction:            'text-blue-400 hover:text-blue-300',
    formResendCodeLink:         'text-blue-400 hover:text-blue-300',
    identityPreviewEditButton:  'text-blue-400 hover:text-blue-300',
    footerActionLink:           'text-blue-400 hover:text-blue-300',

    // Social / dividers
    socialButtonsBlockButton:
      'bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-all rounded-xl',
    socialButtonsBlockButtonText: 'text-white font-medium',
    dividerLine:                'bg-white/10',
    dividerText:                'text-gray-500',
    alertText:                  'text-red-400',

    // UserButton popover (the menu in the screenshot)
    userButtonPopoverCard:         'bg-[#0c0c16] border border-white/[0.08] shadow-2xl shadow-black/60',
    userButtonPopoverActionButton: 'text-gray-200 hover:bg-white/[0.05] hover:text-white',
    userButtonPopoverActionButtonText: 'text-gray-200',
    userButtonPopoverActionButtonIcon: 'text-gray-400',
    userButtonPopoverFooter:       'border-t border-white/[0.06]',
    userPreviewMainIdentifier:     'text-white font-medium',
    userPreviewSecondaryIdentifier:'text-gray-400',

    // UserProfile ("Manage account") modal navigation
    navbar:                     'bg-[#0a0a12] border-r border-white/[0.06]',
    navbarButton:               'text-gray-300 hover:text-white',
    profileSectionTitleText:    'text-white',
    accordionTriggerButton:     'text-gray-200 hover:bg-white/[0.04]',
    badge:                      'bg-blue-500/15 text-blue-300 border border-blue-500/20',
    menuButton:                 'text-gray-200 hover:bg-white/[0.05]',
    menuList:                   'bg-[#0c0c16] border border-white/[0.08]',
  },
};
