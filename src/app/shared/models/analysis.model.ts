export interface VideoReference {
  title: string;
  searchQuery: string;
  channel: string;
}

export interface StepByStep {
  stepNumber: number;
  title: string;
  zone: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  estimatedTime: string;
  description: string;
  technique: string;
  techniqueExplanation: string;
  citadelPaint: string;
  vallejoPaint: string;
  akPaint: string;
  armyPainterPaint: string;
  colorHex: string;
  imageSearchSuggestion: string;
  videoReferences: VideoReference[];
  commonMistakes: string;
  proTip: string;
}

export interface AdvancedTechnique {
  name: string;
  applicableZone: string;
  description: string;
  difficulty: string;
  videoSearchQuery: string;
}

export interface PaintEntry {
  zone: string;
  paintingStage: string;
  citadel: string;
  vallejo: string;
  ak: string;
  armyPainter: string;
  hex: string;
}

export interface BrushEntry {
  size: string;
  type: string;
  purpose: string;
  recommendedBrand: string;
}

export interface MaterialEntry {
  material: string;
  purpose: string;
  recommendedProduct: string;
}

export interface PrimerEntry {
  product: string;
  brand: string;
  color: string;
  purpose: string;
}

export interface MaterialsAndTools {
  primersNeeded: PrimerEntry[];
  paintList: PaintEntry[];
  brushesNeeded: BrushEntry[];
  additionalMaterials: MaterialEntry[];
  estimatedTotalCost: string;
  estimatedTotalTime: string;
}

export interface MiniatureIdentification {
  detectedFaction: string;
  miniatureType: string;
  specificUnit: string;
  confidence: string;
  isPrimed: boolean;
  primerColor: string;
  currentPaintingState: string;
}

export interface OfficialColorScheme {
  isOfficialFaction: boolean;
  factionName: string;
  canonicalSchemeDescription: string;
  deviationsFromCanon: string;
  alternativeSchemes: string[];
}

export interface Analysis {
  id?: number | string;
  _id?: string;
  userId: number | string;
  title?: string;
  imageUrl: string;
  detectedColors: string[];
  recommendedScheme: string;
  recommendedTechniques: string[];
  schemeEvaluation: string;
  materialTips: string;
  miniatureIdentification?: MiniatureIdentification;
  officialColorScheme?: OfficialColorScheme;
  primerAdvice?: string;
  stepByStepGuide?: StepByStep[];
  advancedTechniques?: AdvancedTechnique[];
  paintingTips?: string[];
  materialsAndTools?: MaterialsAndTools;
  schemeEvaluationSummary?: string;
  aiError?: boolean;
  createdAt: string;
}
