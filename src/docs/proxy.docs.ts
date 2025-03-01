/**
 * @swagger
 * /proxy:
 *   post:
 *     summary: Send a proxy request to perform an operation with a credential
 *     description: |
 *       This endpoint allows third-party applications to send a proxy request to perform operations
 *       using credentials stored in the Credential Proxy, without ever having direct access to the
 *       actual credential.
 *       
 *       The request must be signed using the application's private key, and the application must
 *       have permission to use the requested credential according to defined policies.
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProxyRequest'
 *     responses:
 *       200:
 *         description: Request accepted and being processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProxyResponse'
 *             examples:
 *               processing:
 *                 value:
 *                   success: true
 *                   status: "PROCESSING"
 *                   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *               pending:
 *                 value:
 *                   success: true
 *                   status: "PENDING"
 *                   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *               denied:
 *                 value:
 *                   success: false
 *                   status: "DENIED"
 *                   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *                   error: "Policy violation: Operation not allowed"
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Credential or application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /proxy/status/{requestId}:
 *   get:
 *     summary: Check the status of a proxy request
 *     description: |
 *       Retrieve the current status of a previously submitted proxy request. The third-party
 *       application can use this endpoint to poll for completion of asynchronous operations.
 *     tags: [Proxy]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the request to check
 *     responses:
 *       200:
 *         description: Request status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProxyResponse'
 *             examples:
 *               processing:
 *                 value:
 *                   success: true
 *                   status: "PROCESSING"
 *                   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *               completed:
 *                 value:
 *                   success: true
 *                   status: "COMPLETED"
 *                   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *                   result: {
 *                     "data": "Response data from the operation"
 *                   }
 *               error:
 *                 value:
 *                   success: false
 *                   status: "ERROR"
 *                   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *                   error: "Error message"
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// This file only contains JSDoc comments for Swagger 