const fs = require('fs');

function patchContentPacksController() {
  const path = 'apps/api/src/content-packs/content-packs.controller.ts';
  let code = fs.readFileSync(path, 'utf8');

  // Add HttpException import
  if (!code.includes('HttpException')) {
    code = code.replace(/import \{ Controller, Get, Post, Body, Param, Put, Delete, UseGuards \} from '@nestjs\/common';/, "import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';");
  }

  // Wrap generate in try catch
  code = code.replace(
    /return this\.contentPacksService\.generate\(workspaceId, dto\);/,
    "try {\n      return await this.contentPacksService.generate(workspaceId, dto);\n    } catch (error: any) {\n      throw new HttpException({\n        message: 'AI Generation failed',\n        details: error.message,\n        type: 'AI_ERROR'\n      }, HttpStatus.INTERNAL_SERVER_ERROR);\n    }"
  );

  // Add async
  code = code.replace(
    /generate\(/,
    "async generate("
  );

  fs.writeFileSync(path, code);
}

function patchAgentController() {
  const path = 'apps/api/src/ai-agent/ai-agent.controller.ts';
  let code = fs.readFileSync(path, 'utf8');

  // Add HttpException import
  if (!code.includes('HttpException')) {
    code = code.replace(/import \{ Controller, Post, Body, Param, UseGuards \} from '@nestjs\/common';/, "import { Controller, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';");
  }

  // Wrap chat in try catch
  code = code.replace(
    /return this\.agentService\.handleUserMessage\(workspaceId, message, history\);/,
    "try {\n      return await this.agentService.handleUserMessage(workspaceId, message, history);\n    } catch (error: any) {\n      throw new HttpException({\n        message: 'AI Chat failed',\n        details: error.message,\n        type: 'AI_ERROR'\n      }, HttpStatus.INTERNAL_SERVER_ERROR);\n    }"
  );

  fs.writeFileSync(path, code);
}

patchContentPacksController();
patchAgentController();
