import logger from '../../src/shared/logger/logger';
import winston from 'winston';

describe('Logger', () => {
  // Mock de console.log para evitar salida en las pruebas
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should log info messages', () => {
    const infoSpy = jest.spyOn(logger, 'info');
    logger.info('Test info message');
    expect(infoSpy).toHaveBeenCalledWith('Test info message');
  });

  it('should log error messages', () => {
    const errorSpy = jest.spyOn(logger, 'error');
    logger.error('Test error message');
    expect(errorSpy).toHaveBeenCalledWith('Test error message');
  });

  it('should have JSON format configuration', () => {
    // Verificamos la configuración del logger directamente
    expect(logger.format).toBeDefined();
    
    // Verificamos que incluya el formato timestamp
    const formats = logger.format?.transform({ level: '', message: '' });
    expect(formats).toHaveProperty('timestamp');
    expect(formats).toHaveProperty('level');
    expect(formats).toHaveProperty('message');
  });

  it('should have Console transport configured', () => {
    expect(logger.transports.length).toBeGreaterThan(0);
    const consoleTransport = logger.transports.find(
      (t) => t instanceof winston.transports.Console
    );
    expect(consoleTransport).toBeDefined();
  });
});