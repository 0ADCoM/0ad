/* Copyright (c) 2014 Wildfire Games
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#include "precompiled.h"

#include "lib/allocators/shared_ptr.h"
#include "lib/file/common/real_directory.h"
#include "lib/file/file.h"
#include "lib/file/file_system.h"
#include "lib/file/file_util.h"
#include "lib/status.h"

Status ReadFile(const OsPath& path, const OsPath& filename, std::string& content)
{
	OsPath file = path / filename;
	if(!FileExists(file))
		return ERR::FILE_NOT_FOUND;

	CFileInfo fileInfo;
	GetFileInfo(file, &fileInfo);

	content.resize(fileInfo.Size());

	RealDirectory rdir(path, 0, 0); // We do not care for priority or flags here

	RETURN_STATUS_IF_ERR(rdir.Load(filename, DummySharedPtr((u8*)content.data()), content.size()));

	return INFO::OK;
}
