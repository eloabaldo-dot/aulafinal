/**
 * Ponto de entrada unificado para o serviço de destinos do SmartTrip
 * Re-exporta contratos tipados, adaptadores e normalizador.
 */

export * from '../types/destination';
export * from './destination/normalizer';
export * from './destination/destinationService';
export * from './destination/providers/mockDestinationProvider';
export * from './destination/providers/nominatimDestinationProvider';
export * from './destination/providers/compositeDestinationProvider';
