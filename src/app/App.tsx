import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from '@/store/ProjectStore'
import LandingPage from '@/features/landing/LandingPage'
import ActivityStep from '@/features/onboarding/ActivityStep'
import ObjectivesStep from '@/features/onboarding/ObjectivesStep'
import FeaturesStep from '@/features/onboarding/FeaturesStep'
import ThemeStep from '@/features/onboarding/ThemeStep'
import ColorsStep from '@/features/onboarding/ColorsStep'
import BuilderPage from '@/features/builder/BuilderPage'
import VisitorPage from '@/features/preview/VisitorPage'

export default function App() {
  return (
    <ProjectProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/creer/activite" element={<ActivityStep />} />
          <Route path="/creer/objectifs" element={<ObjectivesStep />} />
          <Route path="/creer/fonctionnalites" element={<FeaturesStep />} />
          <Route path="/creer/theme" element={<ThemeStep />} />
          <Route path="/creer/couleurs" element={<ColorsStep />} />
          <Route path="/creer/site" element={<BuilderPage />} />
          <Route path="/apercu" element={<VisitorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProjectProvider>
  )
}
