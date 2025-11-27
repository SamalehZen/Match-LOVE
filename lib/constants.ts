export const APP_NAME = 'RaniyaMatch'
export const APP_DESCRIPTION = 'Trouvez le lieu parfait pour vos rendez-vous en couple'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ROOM: '/room',
  HISTORY: '/history',
} as const

export const MAX_PLACES_PER_ROUND = 3
export const MIN_PLACES_PER_ROUND = 1
export const ROOM_EXPIRY_HOURS = 24

export const ROOM_STATUS = {
  WAITING: 'waiting',
  READY: 'ready',
  SELECTING: 'selecting',
  COMPARING: 'comparing',
  MATCHED: 'matched',
} as const

export const USER_STATUS = {
  IDLE: 'idle',
  READY: 'ready',
  SELECTING: 'selecting',
  VALIDATING: 'validating',
} as const

export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Connexion réussie !',
    LOGIN_ERROR: 'Erreur de connexion',
    REGISTER_SUCCESS: 'Inscription réussie !',
    REGISTER_ERROR: "Erreur lors de l'inscription",
    LOGOUT_SUCCESS: 'Déconnexion réussie',
  },
  ROOM: {
    CREATED: 'Room créée avec succès',
    JOINED: 'Vous avez rejoint la room',
    LEFT: 'Vous avez quitté la room',
    INVITATION_SENT: 'Invitation envoyée',
  },
  MATCH: {
    FOUND: 'Match trouvé ! 🎉',
    NOT_FOUND: 'Aucun match, réessayez',
  },
} as const
