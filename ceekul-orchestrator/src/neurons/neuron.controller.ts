import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NeuronService } from './neuron.service';
import type { EarnNeuronsDto, AllocateNeuronsDto, NeuronPool } from './neuron.types';

/**
 * NeuronController — REST API for the Ceekul Neuron participation system.
 *
 * Base path: /api/neurons
 *
 * All endpoints operate on internal platform units (neurons) only.
 * No monetary value is stored, transmitted, or computed here.
 */
@Controller('api/neurons')
export class NeuronController {
  constructor(private readonly neuronService: NeuronService) {}

  // ── Balance ─────────────────────────────────────────────────────────────

  /**
   * GET /api/neurons/balance/:userId
   * Returns the complete neuron balance for a user, broken down by type.
   */
  @Get('balance/:userId')
  getBalance(@Param('userId') userId: string) {
    return this.neuronService.getBalance(userId);
  }

  // ── Transactions ─────────────────────────────────────────────────────────

  /**
   * GET /api/neurons/transactions/:userId
   * Returns paginated transaction history (most recent first).
   * ?limit=50&offset=0
   */
  @Get('transactions/:userId')
  getTransactions(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.neuronService.getTransactions(userId, limit, offset);
  }

  // ── Earning ──────────────────────────────────────────────────────────────

  /**
   * POST /api/neurons/earn
   * Called server-side whenever a trackable activity is completed.
   * Client-side code should NEVER call this directly in production;
   * activity completion must be verified server-side first.
   *
   * Body: EarnNeuronsDto
   * {
   *   userId: string,
   *   trigger: NeuronTrigger,
   *   referenceId: string,
   *   referenceType: string,
   *   metadata?: Record<string, unknown>   // e.g. { score: 95 } for quizzes
   * }
   */
  @Post('earn')
  @HttpCode(HttpStatus.OK)
  earnNeurons(@Body() dto: EarnNeuronsDto) {
    return this.neuronService.earnNeurons(dto);
  }

  // ── Allocation ───────────────────────────────────────────────────────────

  /**
   * POST /api/neurons/allocate
   * Debit neurons from a user's available balance, directing them to
   * a community pool or a gated content unlock.
   * Neurons never leave the platform and are never converted to money.
   *
   * Body: AllocateNeuronsDto
   * {
   *   userId: string,
   *   neuronType: NeuronType,
   *   amount: number,
   *   poolId?: string,        // mutually exclusive with gatedItemId
   *   gatedItemId?: string,
   *   description: string
   * }
   */
  @Post('allocate')
  @HttpCode(HttpStatus.OK)
  allocateNeurons(@Body() dto: AllocateNeuronsDto) {
    return this.neuronService.allocateNeurons(dto);
  }

  // ── Pools ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/neurons/pools
   * Lists all community allocation pools (active, funded, closed).
   */
  @Get('pools')
  getAllPools() {
    return this.neuronService.getAllPools();
  }

  /**
   * GET /api/neurons/pools/:poolId
   * Returns a single pool's details.
   */
  @Get('pools/:poolId')
  getPool(@Param('poolId') poolId: string) {
    return this.neuronService.getPool(poolId);
  }

  /**
   * POST /api/neurons/pools
   * Create a new community pool. Only Directors/Admins should be able
   * to call this — add a role guard in production.
   */
  @Post('pools')
  @HttpCode(HttpStatus.CREATED)
  createPool(
    @Body()
    body: Omit<NeuronPool, 'id' | 'currentNeurons' | 'participantCount' | 'status' | 'createdAt'>,
  ) {
    return this.neuronService.createPool(body);
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  /**
   * GET /api/neurons/leaderboard
   * Returns top participants ranked by total neurons earned.
   * ?limit=20
   */
  @Get('leaderboard')
  getLeaderboard(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.neuronService.getLeaderboard(limit);
  }

  // ── Rules (public read-only) ──────────────────────────────────────────────

  /**
   * GET /api/neurons/rules
   * Lists all earning rules — useful for the frontend to display
   * "how to earn neurons" guides.
   */
  @Get('rules')
  getRules() {
    const { EARNING_RULES } = require('./neuron.types');
    return EARNING_RULES;
  }
}
