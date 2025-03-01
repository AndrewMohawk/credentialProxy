/**
 * @swagger
 * /credentials:
 *   get:
 *     summary: Get all credentials
 *     description: Retrieve a list of all credentials for the authenticated user
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 credentials:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Credential'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a new credential
 *     description: Create a new credential for accessing external services
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - credentials
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the credential
 *               type:
 *                 type: string
 *                 description: Type of credential (e.g., "API_KEY", "OAUTH2", "BASIC_AUTH")
 *               credentials:
 *                 type: object
 *                 description: Credential data (structure depends on type)
 *               description:
 *                 type: string
 *                 description: Optional description of the credential
 *     responses:
 *       201:
 *         description: Credential created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 credential:
 *                   $ref: '#/components/schemas/Credential'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /credentials/{id}:
 *   get:
 *     summary: Get credential by ID
 *     description: Get a specific credential by its ID
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the credential to retrieve
 *     responses:
 *       200:
 *         description: Credential retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 credential:
 *                   $ref: '#/components/schemas/Credential'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     summary: Update credential
 *     description: Update an existing credential
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the credential to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the credential
 *               type:
 *                 type: string
 *                 description: Type of credential (e.g., "API_KEY", "OAUTH2", "BASIC_AUTH")
 *               credentials:
 *                 type: object
 *                 description: Credential data (structure depends on type)
 *               description:
 *                 type: string
 *                 description: Optional description of the credential
 *     responses:
 *       200:
 *         description: Credential updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 credential:
 *                   $ref: '#/components/schemas/Credential'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     summary: Delete credential
 *     description: Delete a credential by its ID
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the credential to delete
 *     responses:
 *       200:
 *         description: Credential deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Credential deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// This file only contains JSDoc comments for Swagger