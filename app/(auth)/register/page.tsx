import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-1">Inscription</h1>
      <p className="text-sm text-neutral-600 mb-6">Créez votre compte</p>
      <RegisterForm />
      <p className="text-sm text-neutral-600 mt-6">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
      </p>
    </div>
  )
}
